# Blog Feature

## Admin

username: owner@test.com
password: password123

### Content Management (http://localhost:3001/dashboard/content)

- Should not have a "New Blog Post" Button

#### Create New Page Wizard
(This modal is discoverable by clicking "Create New Page")
- Once a page title is added and the continue button is clicked, there must be a page type of "Blog Post" available to select
- The "Choose a Template" step must match the theme, look & feel of other page types' template selection.
- Clicking "Create Page" on a blog post will create a blog post page type
- Header section must allow entry of title, sub-title, image, author, published date

#### Edit Page

##### Settings Panel (Sections)

- Should have a "Blog Header" (New, Required) type of section
  - Title
  - Subtitle
  - Author
  - Published Date
  - Image (Optional)
- Should have a "Content" (Required) type of section

## Public Site

- Must show a "Blog" link if any blog items exist

### Blog Page

- Blog Header must show title, sub-title, image, author name, and published date
- Must show the latest blog entry on the left (2/3)
- must show the list of past blog posts on the right in a list of links (1/3)

