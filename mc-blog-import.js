var BLOG_API = 'https://agent-edge-backend.vercel.app/api/blog-api';
var blogPosts = [];

function loadBlogPosts() {
  fetch(BLOG_API + '?action=list')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (!data.success) return;
      blogPosts = data.posts || [];
      renderBlogList();
    })
    .catch(function() {
      document.getElementById('blogPostList').innerHTML = '<div style="font-size:12px;color:var(--accent-red);padding:8px 0;">Failed to load posts</div>';
    });
}

function renderBlogList() {
  var el = document.getElementById('blogPostList');
  if (!blogPosts.length) {
    el.innerHTML = '<div style="font-size:12px;color:var(--text-muted);padding:8px 0;">No blog posts yet. Click &quot;New Post&quot; to get started.</div>';
    return;
  }

  var active = blogPosts.filter(function(p) { return p.status !== 'archived'; });
  var archived = blogPosts.filter(function(p) { return p.status === 'archived'; });

  function makeRow(p, isArchived) {
    var dateStr = p.published_at ? new Date(p.published_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : 'Draft';
    var badge = p.status === 'published' ? '<span class="blog-badge published">Published</span>'
              : p.status === 'archived' ? '<span class="blog-badge" style="background:rgba(100,100,100,0.15);color:#888;">Archived</span>'
              : '<span class="blog-badge draft">Draft</span>';
    var archiveBtn = !isArchived
      ? '<button class="topbar-btn" title="Archive" onclick="event.stopPropagation();archiveBlogPost(\'' + p.id + '\')" style="padding:4px 8px;font-size:11px;color:#888;border-color:rgba(150,150,150,0.3);margin-right:4px;"><i class="fas fa-box-archive"></i></button>'
      : '<button class="topbar-btn" title="Restore" onclick="event.stopPropagation();restoreBlogPost(\'' + p.id + '\')" style="padding:4px 8px;font-size:11px;color:#6e7f77;border-color:rgba(110,127,119,0.3);margin-right:4px;"><i class="fas fa-rotate-left"></i></button>';
    return '<div class="blog-row" onclick="editBlogPost(\'' + p.id + '\')">' +
      '<div style="flex:1;"><div class="blog-row-title">' + escBlogHtml(p.title) + '</div>' +
      '<div class="blog-row-meta">' + escBlogHtml(p.category) + ' &middot; ' + dateStr + '</div></div>' +
      badge + archiveBtn +
      '<button class="topbar-btn" onclick="event.stopPropagation();deleteBlogPost(\'' + p.id + '\',\'' + escBlogHtml(p.title).replace(/'/g, "\\'") + '\')" style="padding:4px 8px;font-size:11px;color:var(--accent-red);border-color:rgba(220,38,38,0.3);"><i class="fas fa-trash"></i></button>' +
      '</div>';
  }

  var html = '';
  if (active.length === 0) {
    html += '<div style="font-size:12px;color:var(--text-muted);padding:8px 0;">No active posts. Click &quot;New Post&quot; to get started.</div>';
  } else {
    active.forEach(function(p) { html += makeRow(p, false); });
  }

  if (archived.length > 0) {
    html += '<div style="margin-top:14px;">' +
      '<button onclick="toggleBlogArchive()" style="background:none;border:none;color:var(--text-muted);font-size:12px;cursor:pointer;padding:4px 0;display:flex;align-items:center;gap:6px;font-family:inherit;">' +
      '<i class="fas fa-chevron-right" id="blogArchiveChevron" style="font-size:10px;transition:transform 0.2s;"></i>' +
      'Archived (' + archived.length + ')</button>' +
      '<div id="blogArchiveList" style="display:none;margin-top:6px;">';
    archived.forEach(function(p) { html += makeRow(p, true); });
    html += '</div></div>';
  }

  el.innerHTML = html;
}

function toggleBlogArchive() {
  var list = document.getElementById('blogArchiveList');
  var chevron = document.getElementById('blogArchiveChevron');
  var open = list.style.display === 'block';
  list.style.display = open ? 'none' : 'block';
  chevron.style.transform = open ? 'rotate(0deg)' : 'rotate(90deg)';
}

function archiveBlogPost(id) {
  if (!confirm('Archive this post? It will still appear on the public View All Posts page.')) return;
  fetch(BLOG_API, {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({action:'update', id:id, status:'archived', keep_date:true})
  }).then(function(r) { return r.json(); }).then(function() { loadBlogPosts(); });
}

function restoreBlogPost(id) {
  fetch(BLOG_API, {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({action:'update', id:id, status:'published', keep_date:true})
  }).then(function(r) { return r.json(); }).then(function() { loadBlogPosts(); });
}


function escBlogHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function openBlogEditor() {
  document.getElementById('blogEditorTitle').textContent = 'New Blog Post';
  document.getElementById('blogEditId').value = '';
  document.getElementById('blogTitle').value = '';
  document.getElementById('blogCategory').value = 'Home Buying';
  document.getElementById('blogSummary').value = '';
  document.getElementById('blogImageUrl').value = '';
  document.getElementById('blogBody').value = '';
  document.getElementById('blogAiTopic').value = '';
  document.getElementById('blogSaveStatus').textContent = '';
  document.getElementById('blogImgSearchInput').value = '';
  document.getElementById('blogImgResults').innerHTML = '';
  document.getElementById('blogImgCredit').textContent = '';
  document.getElementById('blogPreviewPanel').style.display = 'none';
  document.getElementById('blogImgPreview').style.display = 'none';
  document.getElementById('blogEditor').style.display = 'block';
}

function closeBlogEditor() { document.getElementById('blogEditor').style.display = 'none'; }

function editBlogPost(id) {
  var post = blogPosts.find(function(p) { return p.id === id; });
  if (!post) return;
  fetch(BLOG_API + '?action=single&slug=' + encodeURIComponent(post.slug || ''))
    .then(function(r) { return r.json(); })
    .then(function(data) { fillBlogEditor(data.success && data.post ? data.post : post); })
    .catch(function() { fillBlogEditor(post); });
}

function fillBlogEditor(post) {
  document.getElementById('blogEditorTitle').textContent = 'Edit: ' + (post.title || 'Untitled');
  document.getElementById('blogEditId').value = post.id;
  document.getElementById('blogTitle').value = post.title || '';
  document.getElementById('blogCategory').value = post.category || 'Home Buying';
  document.getElementById('blogSummary').value = post.summary || '';
  document.getElementById('blogImageUrl').value = post.image_url || '';
  document.getElementById('blogBody').value = post.body || '';
  document.getElementById('blogAiTopic').value = '';
  document.getElementById('blogSaveStatus').textContent = '';
  document.getElementById('blogImgSearchInput').value = '';
  document.getElementById('blogImgResults').innerHTML = '';
  document.getElementById('blogImgCredit').textContent = '';
  document.getElementById('blogPreviewPanel').style.display = 'none';
  if (post.image_url) {
    document.getElementById('blogImgThumb').src = post.image_url;
    document.getElementById('blogImgPreview').style.display = 'flex';
  } else {
    document.getElementById('blogImgPreview').style.display = 'none';
  }
  document.getElementById('blogEditor').style.display = 'block';
}

function saveBlogPost(status) {
  var id = document.getElementById('blogEditId').value;
  var payload = {
    action: id ? 'update' : 'create',
    title: document.getElementById('blogTitle').value.trim(),
    category: document.getElementById('blogCategory').value,
    summary: document.getElementById('blogSummary').value.trim(),
    image_url: document.getElementById('blogImageUrl').value.trim(),
    body: document.getElementById('blogBody').value,
    status: status
  };
  if (id) payload.id = id;
  if (!payload.title) { document.getElementById('blogSaveStatus').textContent = 'Title is required'; return; }
  document.getElementById('blogSaveStatus').textContent = 'Saving...';
  fetch(BLOG_API, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.success) {
        document.getElementById('blogSaveStatus').textContent = status === 'published' ? 'Published!' : 'Draft saved!';
        if (data.post && data.post.id) document.getElementById('blogEditId').value = data.post.id;
        loadBlogPosts();
      } else { document.getElementById('blogSaveStatus').textContent = 'Error: ' + (data.error || 'Unknown'); }
    })
    .catch(function(err) { document.getElementById('blogSaveStatus').textContent = 'Error: ' + err.message; });
}

function deleteBlogPost(id, title) {
  if (!confirm('Delete "' + title + '"? This cannot be undone.')) return;
  fetch(BLOG_API, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ action:'delete', id:id }) })
    .then(function(r) { return r.json(); })
    .then(function(data) { if (data.success) loadBlogPosts(); });
}

function blogAiDraft() {
  var topic = document.getElementById('blogAiTopic').value.trim();
  if (!topic) { alert('Enter a topic first'); return; }
  var btn = document.getElementById('blogAiDraftBtn');
  btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Drafting...';
  fetch(BLOG_API, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ action:'ai-draft', topic:topic }) })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      btn.disabled = false; btn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Draft from Topic';
      if (data.success && data.draft) {
        if (data.draft.title) document.getElementById('blogTitle').value = data.draft.title;
        if (data.draft.category) document.getElementById('blogCategory').value = data.draft.category;
        if (data.draft.summary) document.getElementById('blogSummary').value = data.draft.summary;
        if (data.draft.body) document.getElementById('blogBody').value = data.draft.body;
      }
    })
    .catch(function(err) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Draft from Topic'; alert('AI draft failed: ' + err.message); });
}

function blogAiPolish() {
  var body = document.getElementById('blogBody').value.trim();
  if (!body) { alert('Write something first, then click Polish'); return; }
  var btn = document.getElementById('blogAiPolishBtn');
  btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Polishing...';
  fetch(BLOG_API, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ action:'ai-polish', text:body }) })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      btn.disabled = false; btn.innerHTML = '<i class="fas fa-sparkles"></i> Polish My Writing';
      if (data.success && data.polished) document.getElementById('blogBody').value = data.polished;
    })
    .catch(function(err) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-sparkles"></i> Polish My Writing'; alert('AI polish failed: ' + err.message); });
}

function previewBlogPost() {
  var title = document.getElementById('blogTitle').value || 'Untitled';
  var category = document.getElementById('blogCategory').value || 'General';
  var body = document.getElementById('blogBody').value;
  var imgUrl = document.getElementById('blogImageUrl').value;
  if (!body) { alert('Nothing to preview.'); return; }
  var imgHtml = imgUrl ? '<img src="' + imgUrl + '" style="width:100%;max-height:250px;object-fit:cover;border-radius:8px;margin-bottom:16px;">' : '';
  document.getElementById('blogPreviewContent').innerHTML =
    '<div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#7c3aed;font-weight:700;margin-bottom:8px;">' + category + '</div>' +
    '<div style="font-size:22px;font-weight:700;margin-bottom:16px;color:var(--text-primary);">' + title.replace(/</g,'&lt;') + '</div>' +
    imgHtml + '<div style="font-size:14px;line-height:1.8;color:var(--text-primary);">' + body + '</div>';
  document.getElementById('blogPreviewPanel').style.display = 'block';
}

function blogAiRewrite() {
  var body = document.getElementById('blogBody').value.trim();
  if (!body) { alert('Write something first.'); return; }
  var instructions = document.getElementById('blogRewriteInstructions').value.trim();
  var btn = document.getElementById('blogAiRewriteBtn');
  btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Rewriting...';
  fetch(BLOG_API, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ action:'ai-polish', text:body, instructions:instructions }) })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      btn.disabled = false; btn.innerHTML = '<i class="fas fa-rotate"></i> AI Rewrite';
      if (data.success && data.polished) document.getElementById('blogBody').value = data.polished;
    })
    .catch(function(err) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-rotate"></i> AI Rewrite'; alert('Rewrite failed: ' + err.message); });
}

// Image Picker Modal
var blogSelectedImg = null;

function openBlogImagePicker() {
  document.getElementById('blogImgModalOverlay').style.display = 'block';
  document.getElementById('blogImgModal').style.display = 'flex';
  document.getElementById('blogImgSearchInput').value = '';
  document.getElementById('blogImgResults').innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#9ca3b4;font-size:14px;">Search for images above to get started</div>';
  document.getElementById('blogImgModalCredit').textContent = '';
  document.getElementById('blogImgConfirmBtn').disabled = true;
  document.getElementById('blogImgConfirmBtn').style.opacity = '0.5';
  blogSelectedImg = null;
  setTimeout(function() { document.getElementById('blogImgSearchInput').focus(); }, 100);
}

function closeBlogImagePicker() {
  document.getElementById('blogImgModalOverlay').style.display = 'none';
  document.getElementById('blogImgModal').style.display = 'none';
}

function confirmBlogImage() {
  if (!blogSelectedImg) return;
  document.getElementById('blogImageUrl').value = blogSelectedImg.regular;
  document.getElementById('blogImgCredit').textContent = 'Photo by ' + blogSelectedImg.photographer;
  document.getElementById('blogImgThumb').src = blogSelectedImg.thumb;
  document.getElementById('blogImgPreview').style.display = 'flex';
  closeBlogImagePicker();
}

function clearBlogImage() {
  document.getElementById('blogImageUrl').value = '';
  document.getElementById('blogImgCredit').textContent = '';
  document.getElementById('blogImgPreview').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function() {
  var searchBtn = document.getElementById('blogImgSearchBtn');
  var searchInput = document.getElementById('blogImgSearchInput');
  if (searchBtn) searchBtn.addEventListener('click', blogSearchImages);
  if (searchInput) searchInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') blogSearchImages(); });
});

function blogSearchImages() {
  var query = document.getElementById('blogImgSearchInput').value.trim();
  if (!query) return;
  var btn = document.getElementById('blogImgSearchBtn');
  var resultsDiv = document.getElementById('blogImgResults');
  btn.disabled = true; btn.textContent = 'Searching...';
  resultsDiv.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#9ca3b4;font-size:14px;">Searching...</div>';

  fetch('https://agent-edge-backend.vercel.app/api/image-search?query=' + encodeURIComponent(query))
    .then(function(r) { return r.json(); })
    .then(function(data) {
      btn.disabled = false; btn.textContent = 'Search';
      if (!data.success || !data.images || data.images.length === 0) {
        resultsDiv.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#9ca3b4;font-size:14px;">No images found. Try different keywords.</div>';
        return;
      }
      resultsDiv.innerHTML = '';
      data.images.forEach(function(img) {
        var div = document.createElement('div');
        div.style.cssText = 'aspect-ratio:1;border-radius:8px;overflow:hidden;cursor:pointer;border:3px solid transparent;transition:all 0.2s;';
        div.innerHTML = '<img src="' + img.thumb + '" alt="' + (img.alt || '') + '" style="width:100%;height:100%;object-fit:cover;display:block;">';
        div.addEventListener('mouseover', function() { div.style.transform = 'scale(1.05)'; div.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; });
        div.addEventListener('mouseout', function() { if (!div.classList.contains('selected')) { div.style.transform = ''; div.style.boxShadow = ''; } });
        div.addEventListener('click', function() {
          resultsDiv.querySelectorAll('div').forEach(function(el) { el.classList.remove('selected'); el.style.borderColor = 'transparent'; el.style.boxShadow = ''; });
          div.classList.add('selected');
          div.style.borderColor = '#2563eb';
          div.style.boxShadow = '0 0 0 2px #2563eb';
          blogSelectedImg = img;
          document.getElementById('blogImgModalCredit').textContent = 'Photo by ' + img.photographer + ' on Unsplash';
          document.getElementById('blogImgConfirmBtn').disabled = false;
          document.getElementById('blogImgConfirmBtn').style.opacity = '1';
        });
        resultsDiv.appendChild(div);
      });
    })
    .catch(function() {
      btn.disabled = false; btn.textContent = 'Search';
      resultsDiv.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#dc2626;font-size:14px;">Search failed. Try again.</div>';
    });
}
