-- Sample data script (run this AFTER you have signed up at least one user)
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID from auth.users table

-- To get your user ID, run this query first:
-- SELECT id, email FROM auth.users LIMIT 1;

-- Then uncomment and run the following with your actual user ID:

/*
-- Sample project
INSERT INTO public.projects (id, user_id, name, description) VALUES 
(
  uuid_generate_v4(),
  'YOUR_USER_ID_HERE', -- Replace with your actual user ID
  'My First Project',
  'A sample project to test the v0 clone platform'
);

-- Sample chat thread (replace PROJECT_ID with the actual project ID)
INSERT INTO public.chat_threads (id, user_id, project_id, title) VALUES 
(
  uuid_generate_v4(),
  'YOUR_USER_ID_HERE', -- Replace with your actual user ID
  (SELECT id FROM public.projects WHERE user_id = 'YOUR_USER_ID_HERE' LIMIT 1),
  'Landing Page Design'
);
*/
