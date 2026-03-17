const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

console.log('PROJECTS ROUTES LOADED AND WORKING');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

router.get('/test', (req, res) => {
  console.log('GET /api/projects/test - Test endpoint hit');
  res.json({
    message: 'Projects API is working!',
    path: '/api/projects/test',
    timestamp: new Date().toISOString()
  });
});

router.get('/', async (req, res) => {
  try {
    console.log(' GET /api/projects - Fetching projects');

    if (!req.session?.userId || !req.session?.isLoggedIn) {
      console.log(' Not authenticated');
      return res.status(401).json({ error: 'Not authenticated' });
    }

    console.log(`Fetching projects for user: ${req.session.userId}`);

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', req.session.userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error(' Supabase error:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`Found ${data?.length || 0} projects`);

    const transformedData = (data || []).map(project => ({
      id: project.id,
      title: project.title || 'Untitled Project',
      code: project.code || '',
      created_at: project.created_at,
      updated_at: project.updated_at,
      user_id: project.user_id
    }));

    res.json(transformedData);
  } catch (error) {
    console.error(' Get projects error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    console.log('POST /api/projects - Creating project');
    console.log('Session user ID:', req.session.userId);

    if (!req.session?.userId || !req.session?.isLoggedIn) {
      console.log(' Not authenticated');
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { title = 'Untitled Project', code = '' } = req.body;
    const userId = req.session.userId;

    console.log(`Creating project for user ${userId}: "${title}"`);
    console.log('Code length:', code.length);

    const projectData = {
      user_id: userId,
      title: title.trim() || 'Untitled Project',
      code: code || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Project data to insert:', projectData);

    const { data, error } = await supabase
      .from('projects')
      .insert([projectData])
      .select()
      .single();

    if (error) {
      console.error(' Supabase insert error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      if (error.code === '42501') {
        return res.status(403).json({ 
          error: 'RLS Policy violation',
          message: 'Row-level security is blocking this operation. Please check your RLS policies.',
          details: error.message,
          fix: 'Run: ALTER TABLE projects DISABLE ROW LEVEL SECURITY; in Supabase SQL editor'
        });
      }
      
      throw error;
    }

    console.log(`Project created successfully:`, data);

    const responseData = {
      id: data.id,
      title: data.title,
      code: data.code || '',
      created_at: data.created_at,
      updated_at: data.updated_at,
      user_id: data.user_id
    };

    res.status(201).json(responseData);

  } catch (error) {
    console.error(' Create project error:', error);
    res.status(500).json({ 
      error: 'Create failed',
      message: error.message,
      code: error.code
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    console.log(`GET /api/projects/${req.params.id}`);

    if (!req.session?.userId || !req.session?.isLoggedIn) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.session.userId)
      .single();

    if (error) {
      console.error(' Supabase error:', error);
      return res.status(404).json({ error: 'Project not found' });
    }

    if (!data) {
      return res.status(404).json({ error: "Project not found" });
    }

    const transformedData = {
      id: data.id,
      title: data.title,
      code: data.code || '',
      created_at: data.created_at,
      updated_at: data.updated_at,
      user_id: data.user_id
    };

    res.json(transformedData);
  } catch (error) {
    console.error(' Get project error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    console.log(`PUT /api/projects/${req.params.id}`);
    console.log('Request body:', req.body);

    if (!req.session?.userId || !req.session?.isLoggedIn) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { title, code } = req.body;
    const projectId = req.params.id;
    const userId = req.session.userId;

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (title !== undefined) {
      updateData.title = title.trim();
    }
    if (code !== undefined) {
      updateData.code = code;
    }

    console.log('Update data:', updateData);

    const { data: existingProject, error: checkError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (checkError || !existingProject) {
      return res.status(404).json({ error: 'Project not found or access denied' });
    }

    const { error: updateError } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .eq('user_id', userId);

    if (updateError) {
      console.error(' Update error:', updateError);
      throw updateError;
    }

    console.log('Update executed successfully');

    const { data: updatedProject, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error(' Fetch error:', fetchError);
      throw fetchError;
    }

    if (!updatedProject) {
      return res.status(404).json({ error: 'Failed to fetch updated project' });
    }

    const responseData = {
      id: updatedProject.id,
      title: updatedProject.title,
      code: updatedProject.code || '',
      created_at: updatedProject.created_at,
      updated_at: updatedProject.updated_at,
      user_id: updatedProject.user_id
    };

    console.log('Project updated successfully:', responseData);
    res.json(responseData);

  } catch (error) {
    console.error(' Update project error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    console.log(`DELETE /api/projects/${req.params.id}`);

    if (!req.session?.userId || !req.session?.isLoggedIn) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.session.userId);

    if (error) {
      console.error(' Supabase delete error:', error);
      throw error;
    }

    console.log(`Project ${req.params.id} deleted`);
    res.json({ success: true });
  } catch (error) {
    console.error(' Delete project error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;