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

  function makeCard(p, isArchived) {
    var dateStr = p.published_at ? new Date(p.published_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : 'Draft';
    var badge = p.status === 'published' ? '<span style="display:inline-block;padding:3px 10px;border-radius:4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;background:rgba(34,197,94,0.12);color:#16a34a;">Published</span>'
              : p.status === 'archived' ? '<span style="display:inline-block;padding:3px 10px;border-radius:4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;background:rgba(100,100,100,0.1);color:#888;">Archived</span>'
              : '<span style="display:inline-block;padding:3px 10px;border-radius:4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;background:rgba(234,179,8,0.12);color:#b45309;">Draft</span>';
    var img = p.image_url
      ? '<div style="width:100%;aspect-ratio:16/9;border-radius:8px 8px 0 0;overflow:hidden;background:#f0f2f5;"><img src="' + p.image_url + '" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.parentElement.style.display=\'none\'"></div>'
      : '<div style="width:100%;aspect-ratio:16/9;border-radius:8px 8px 0 0;background:linear-gradient(135deg,#e2e5ed,#f0f2f5);display:flex;align-items:center;justify-content:center;"><i class="fas fa-pen-nib" style="font-size:24px;color:#ccc;"></i></div>';
    var category = p.category ? '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6e7f77;margin-bottom:4px;">' + escBlogHtml(p.category) + '</div>' : '';
    var summary = p.summary ? '<div style="font-size:12px;color:var(--text-muted);line-height:1.5;margin-top:6px;">' + escBlogHtml(p.summary) + '</div>' : '';
    var archiveBtn = !isArchived
      ? '<button title="Archive" onclick="event.stopPropagation();archiveBlogPost(\'' + p.id + '\')" style="background:none;border:none;cursor:pointer;color:#888;font-size:12px;padding:4px;"><i class="fas fa-box-archive"></i></button>'
      : '<button title="Restore" onclick="event.stopPropagation();restoreBlogPost(\'' + p.id + '\')" style="background:none;border:none;cursor:pointer;color:#6e7f77;font-size:12px;padding:4px;"><i class="fas fa-rotate-left"></i></button>';
    var deleteBtn = '<button title="Delete" onclick="event.stopPropagation();deleteBlogPost(\'' + p.id + '\',\'' + escBlogHtml(p.title).replace(/'/g, "\\'") + '\')" style="background:none;border:none;cursor:pointer;color:#dc2626;font-size:12px;padding:4px;"><i class="fas fa-trash"></i></button>';

    return '<div onclick="editBlogPost(\'' + p.id + '\')" style="background:white;border:1px solid var(--border);border-radius:8px;overflow:hidden;cursor:pointer;transition:box-shadow 0.2s,transform 0.2s;" onmouseover="this.style.boxShadow=\'0 4px 12px rgba(0,0,0,0.08)\';this.style.transform=\'translateY(-2px)\'" onmouseout="this.style.boxShadow=\'none\';this.style.transform=\'none\'">' +
      img +
      '<div style="padding:14px;">' +
        category +
        '<div style="font-size:14px;font-weight:700;color:var(--text-primary);line-height:1.3;">' + escBlogHtml(p.title) + '</div>' +
        summary +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px;">' +
          '<div style="display:flex;align-items:center;gap:6px;">' + badge + '<span style="font-size:11px;color:var(--text-muted);">' + dateStr + '</span></div>' +
          '<div style="display:flex;gap:4px;">' + archiveBtn + deleteBtn + '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  var html = '';
  if (active.length === 0) {
    html += '<div style="font-size:12px;color:var(--text-muted);padding:8px 0;">No active posts. Click &quot;New Post&quot; to get started.</div>';
  } else {
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;">';
    active.forEach(function(p) { html += makeCard(p, false); });
    html += '</div>';
  }

  if (archived.length > 0) {
    html += '<div style="margin-top:14px;">' +
      '<button onclick="toggleBlogArchive()" style="background:none;border:none;color:var(--text-muted);font-size:12px;cursor:pointer;padding:4px 0;display:flex;align-items:center;gap:6px;font-family:inherit;">' +
      '<i class="fas fa-chevron-right" id="blogArchiveChevron" style="font-size:10px;transition:transform 0.2s;"></i>' +
      'Archived (' + archived.length + ')</button>' +
      '<div id="blogArchiveList" style="display:none;margin-top:6px;display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;">';
    archived.forEach(function(p) { html += makeCard(p, true); });
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
  if (document.getElementById('blogAiBrief')) document.getElementById('blogAiBrief').value = '';
  if (document.getElementById('blogAiTakeaway')) document.getElementById('blogAiTakeaway').value = '';
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
  var brief = (document.getElementById('blogAiBrief') || {}).value || '';
  var audience = (document.getElementById('blogAiAudience') || {}).value || 'general';
  var tone = (document.getElementById('blogAiTone') || {}).value || 'educational';
  var takeaway = (document.getElementById('blogAiTakeaway') || {}).value || '';
  var topic = (document.getElementById('blogAiTopic') || {}).value || '';
  var fullBrief = brief || topic;
  if (!fullBrief.trim()) { alert('Describe what you want the post to be about'); return; }
  var btn = document.getElementById('blogAiDraftBtn');
  btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Drafting...';
  fetch(BLOG_API, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ action:'ai-draft', topic:fullBrief, audience:audience, tone:tone, takeaway:takeaway }) })
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
