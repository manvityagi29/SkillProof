-- Skill catalog
INSERT INTO skills (name, category) VALUES
  ('React', 'frontend'),
  ('TypeScript', 'frontend'),
  ('JavaScript', 'frontend'),
  ('Node.js', 'backend'),
  ('Java', 'backend'),
  ('Python', 'backend'),
  ('Spring Boot', 'backend'),
  ('SQL', 'backend'),
  ('DSA', 'backend'),
  ('AWS', 'devops'),
  ('Figma / UI Design', 'design'),
  ('Machine Learning', 'ml')
ON CONFLICT (name) DO NOTHING;

-- MCQ bank (kept short and real — 5 per skill is enough for a demo assessment)
INSERT INTO assessment_questions (skill_id, question, options, correct_index) VALUES
  ((SELECT id FROM skills WHERE name='React'), 'What triggers a React functional component to re-render?', '["Parent re-render, state change, or context change","Only a page refresh","Only when props are removed","Never, components render once"]', 0),
  ((SELECT id FROM skills WHERE name='React'), 'What does useState return?', '["A single value only","An array: current value and a setter function","A promise","A DOM reference"]', 1),
  ((SELECT id FROM skills WHERE name='React'), 'What is the purpose of a key prop in a list render?', '["Styling list items","Helping React identify which items changed, were added, or removed","Setting the tab order","Encrypting list data"]', 1),
  ((SELECT id FROM skills WHERE name='React'), 'Which hook lets you memoize an expensive computation?', '["useMemo","useRef","useState","useContext"]', 0),
  ((SELECT id FROM skills WHERE name='React'), 'What happens if you mutate state directly instead of using the setter?', '["React always catches it automatically","React may not re-render since it cannot detect the change","It throws a compile-time error","It is the recommended pattern"]', 1),
  ((SELECT id FROM skills WHERE name='Java'), 'Which keyword is used to inherit a class in Java?', '["implements","extends","inherits","super"]', 1),
  ((SELECT id FROM skills WHERE name='Java'), 'What is the default value of a boolean instance variable?', '["true","false","null","0"]', 1),
  ((SELECT id FROM skills WHERE name='Java'), 'Which collection maintains insertion order and allows duplicates?', '["HashSet","ArrayList","TreeSet","HashMap"]', 1),
  ((SELECT id FROM skills WHERE name='Java'), 'What does the "final" keyword do to a variable?', '["Makes it static","Prevents reassignment after initialization","Deletes it after use","Makes it public"]', 1),
  ((SELECT id FROM skills WHERE name='Java'), 'Which exception is unchecked in Java?', '["IOException","SQLException","NullPointerException","InterruptedException"]', 2),
  ((SELECT id FROM skills WHERE name='SQL'), 'Which clause filters rows before aggregation?', '["HAVING","WHERE","GROUP BY","ORDER BY"]', 1),
  ((SELECT id FROM skills WHERE name='SQL'), 'Which join returns only matching rows from both tables?', '["LEFT JOIN","RIGHT JOIN","INNER JOIN","FULL OUTER JOIN"]', 2),
  ((SELECT id FROM skills WHERE name='SQL'), 'What does a UNIQUE constraint enforce?', '["No NULL values","No duplicate values in a column","Sorted order","Foreign key relation"]', 1),
  ((SELECT id FROM skills WHERE name='SQL'), 'Which statement removes a table and its data entirely?', '["DELETE","TRUNCATE","DROP","REMOVE"]', 2),
  ((SELECT id FROM skills WHERE name='SQL'), 'What is a primary key used for?', '["Formatting output","Uniquely identifying a row","Sorting a table","Compressing storage"]', 1),
  ((SELECT id FROM skills WHERE name='JavaScript'), 'Which method converts a JSON string into a JavaScript object?', '["JSON.stringify()","JSON.parse()","JSON.toObject()","JSON.convert()"]', 1),
  ((SELECT id FROM skills WHERE name='JavaScript'), 'What is the output of typeof NaN in JavaScript?', '["number","NaN","undefined","object"]', 0),
  ((SELECT id FROM skills WHERE name='JavaScript'), 'Which of the following creates a block-scoped variable?', '["var","let","constant","global"]', 1),
  ((SELECT id FROM skills WHERE name='JavaScript'), 'What is the event loop responsible for in JavaScript?', '["Executing synchronous code only","Handling asynchronous callbacks and task queues","Compiling TypeScript to JS","Allocating memory for DOM nodes"]', 1),
  ((SELECT id FROM skills WHERE name='JavaScript'), 'What does Promise.all() do if one promise rejects?', '["Waits for all others before rejecting","Immediately rejects with that error","Ignores the rejected promise","Returns null"]', 1),
  ((SELECT id FROM skills WHERE name='Node.js'), 'Which core module is used to handle file operations in Node.js?', '["http","fs","path","os"]', 1),
  ((SELECT id FROM skills WHERE name='Node.js'), 'What pattern does Node.js use for non-blocking I/O?', '["Multi-threading","Event-driven asynchronous callbacks","Actor model","Polling thread pool"]', 1),
  ((SELECT id FROM skills WHERE name='Node.js'), 'Which object provides information about the current Node.js process?', '["global","process","window","system"]', 1),
  ((SELECT id FROM skills WHERE name='Node.js'), 'What is the role of package.json in a Node.js project?', '["Only lists dependencies","Project metadata, dependencies, and script commands","Stores compiled bytecode","Configures OS settings"]', 1),
  ((SELECT id FROM skills WHERE name='Node.js'), 'What does middleware do in Express?', '["Only handles database migrations","Functions that have access to req, res, and next","Renders React components","Creates worker threads"]', 1),
  ((SELECT id FROM skills WHERE name='Python'), 'How do you create a function in Python?', '["function myFunc()","def my_func():","func my_func()","define my_func()"]', 1),
  ((SELECT id FROM skills WHERE name='Python'), 'Which data type is immutable in Python?', '["list","dict","tuple","set"]', 2),
  ((SELECT id FROM skills WHERE name='Python'), 'What does the len() function return?', '["Size of object in bytes","Number of items in a collection","First index of collection","Memory address"]', 1),
  ((SELECT id FROM skills WHERE name='Python'), 'Which keyword is used to handle exceptions in Python?', '["try...catch","try...except","catch...throw","handle...rescue"]', 1),
  ((SELECT id FROM skills WHERE name='Python'), 'What is a list comprehension in Python?', '["A way to compress lists for network transfer","A concise syntax to create lists based on existing iterables","A dictionary lookup method","A debugger tool"]', 1),
  ((SELECT id FROM skills WHERE name='DSA'), 'What is the average time complexity of searching in a balanced Binary Search Tree?', '["O(1)","O(log n)","O(n)","O(n log n)"]', 1),
  ((SELECT id FROM skills WHERE name='DSA'), 'Which data structure works on the LIFO principle?', '["Queue","Stack","Array","Linked List"]', 1),
  ((SELECT id FROM skills WHERE name='DSA'), 'What is the worst-case time complexity of QuickSort?', '["O(n log n)","O(n)","O(n^2)","O(log n)"]', 2),
  ((SELECT id FROM skills WHERE name='DSA'), 'Which algorithm is used to find the shortest path in a weighted graph with non-negative edges?', '["Dijkstra''s Algorithm","Kruskal''s Algorithm","DFS","Prim''s Algorithm"]', 0),
  ((SELECT id FROM skills WHERE name='DSA'), 'What data structure is typically used to implement Breadth-First Search (BFS)?', '["Stack","Queue","Heap","Binary Tree"]', 1);


-- Challenge prompts (used by captains for pre-join verification challenges)
INSERT INTO challenge_prompts (skill_id, title, prompt, time_limit_minutes) VALUES
  ((SELECT id FROM skills WHERE name='React'), 'Searchable User List', 'Build a reusable component that renders a list of users and filters it live as the user types in a search box. Focus on component structure and state handling.', 15),
  ((SELECT id FROM skills WHERE name='React'), 'Fix the Effect', 'This component fetches users on mount but re-fetches on every render, causing an infinite loop. Identify and fix the bug, and explain why it happened.', 10),
  ((SELECT id FROM skills WHERE name='Java'), 'Spring Controller Bug', 'This Spring Boot REST controller returns a 500 error on a valid request. Find the bug and explain the fix.', 15);

-- Demo users are inserted programmatically by src/db/seed.ts (not here), so their
-- passwords are hashed with real bcrypt at seed time instead of a hardcoded hash string.
