import { useState, useRef, useEffect } from "react";
import { Upload, X, Image, Calendar, Trash2, Bold, Italic, Underline, List, ListOrdered } from "lucide-react";

// Import fireStore reference from firebaseConfig file
import { db } from "../database/firebaseConfig.js";

// Import all the required functions from fireStore
import { collection, deleteDoc, doc, onSnapshot, setDoc } from "firebase/firestore";

// Import helper functions
import { formatDate, handleImageFileUpload, applyFormatCommand } from "../helpers/blogHelper.js";

// Import styles
import "./Blog.css";

export default function Blog() {
    const [formData, setformData] = useState({
        title: "",
        content: "",
        imageUrl: "",
    });
    const [blogs, setBlogs] = useState([]);
    const [imagePreview, setImagePreview] = useState(null);

    const titleRef = useRef(null);
    const fileInputRef = useRef(null);
    const contentEditableRef = useRef(null);

    useEffect(() => {
        titleRef.current.focus();
    }, []);
    
    useEffect(() => {
        // LIVE UPDATE CODE
        const unsub = onSnapshot(collection(db, "blogs"), (snapShot) => {
            const blogs = snapShot.docs.map((doc) => {
                return {
                    id: doc.id,
                    ...doc.data(),
                };
            });
            setBlogs(
                blogs.sort((a, b) => b.createdOn?.toDate() - a.createdOn?.toDate())
            );
        });

        return () => unsub();
    }, []);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        handleImageFileUpload(file, (result) => {
            setImagePreview(result);
            setformData({ ...formData, imageUrl: result });
        });
    };

    const removeImage = () => {
        setImagePreview(null);
        setformData({ ...formData, imageUrl: "" });
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const applyFormat = (command, value = null) => {
        applyFormatCommand(command, value, contentEditableRef);
    };

    const handleContentChange = () => {
        const content = contentEditableRef.current.innerHTML;
        setformData({ ...formData, content });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title.trim() || !formData.content.trim()) {
            alert("Please fill in both title and content");
            return;
        }

        titleRef.current.focus();

        const docRef = doc(collection(db, "blogs"));

        await setDoc(docRef, {
            title: formData.title,
            content: formData.content,
            imageUrl: formData.imageUrl,
            createdOn: new Date(),
        });

        setformData({ title: "", content: "", imageUrl: "" });
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        if (contentEditableRef.current) {
            contentEditableRef.current.innerHTML = "";
        }
    };

    const removeBlog = async (id) => {
        if (window.confirm("Are you sure you want to delete this post?")) {
            const docRef = doc(db, "blogs", id);
            await deleteDoc(docRef);
        }
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-orange-50 via-white to-orange-50">
            {/* Header */}
            <div className="bg-linear-to-r from-orange-400 to-yellow-400 text-black py-4 px-4 shadow-lg">
                <h1 className="text-6xl font-mono font-bold text-center tracking-tight">
                    Blog Logs📝
                </h1>
                <p className="text-center mt-3 text-black font-mono font-light opacity-60 italic text-xs">
                    Sharing thoughts with the world about the about !!
                </p>
            </div>

            {/* Form Section */}
            <div className="max-w-3xl mx-auto px-4 py-8">
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-orange-100">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <Image className="w-6 h-6 text-orange-500" />
                        Create New Post
                    </h2>

                    <div className="space-y-6">
                        {/* Title Input */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Title
                            </label>
                            <input
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                                placeholder="Enter an engaging title..."
                                ref={titleRef}
                                value={formData.title}
                                onChange={(e) =>
                                    setformData({ ...formData, title: e.target.value })
                                }
                                required
                            />
                        </div>

                        {/* Image Upload */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Featured Image (Optional)
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-orange-400 transition-all">
                                {!imagePreview ? (
                                    <div className="text-center">
                                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                        <label className="cursor-pointer">
                                            <span className="text-orange-600 hover:text-orange-700 font-semibold">
                                                Click to upload
                                            </span>
                                            <span className="text-gray-500"> or drag and drop</span>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                            />
                                        </label>
                                        <p className="text-xs text-gray-500 mt-2">
                                            PNG, JPG, GIF up to 10MB
                                        </p>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full h-64 object-cover rounded-lg"
                                        />
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all shadow-lg"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Rich Text Editor */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Content
                            </label>

                            {/* Formatting Toolbar */}
                            <div className="border-2 border-gray-200 rounded-t-xl p-2 bg-gray-50 flex flex-wrap gap-1">
                                {/* Text Styling */}
                                <button
                                    type="button"
                                    onClick={() => applyFormat("bold")}
                                    className="p-2 hover:bg-gray-200 rounded transition-all"
                                    title="Bold"
                                >
                                    <Bold className="w-5 h-5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => applyFormat("italic")}
                                    className="p-2 hover:bg-gray-200 rounded transition-all"
                                    title="Italic"
                                >
                                    <Italic className="w-5 h-5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => applyFormat("underline")}
                                    className="p-2 hover:bg-gray-200 rounded transition-all"
                                    title="Underline"
                                >
                                    <Underline className="w-5 h-5" />
                                </button>

                                <div className="w-px bg-gray-300 mx-1"></div>

                                {/* Font Size */}
                                <select
                                    onChange={(e) => applyFormat("fontSize", e.target.value)}
                                    className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-200 transition-all text-sm"
                                    title="Font Size"
                                >
                                    <option value="">Size</option>
                                    <option value="1">Small</option>
                                    <option value="3">Normal</option>
                                    <option value="5">Large</option>
                                    <option value="7">Huge</option>
                                </select>

                                {/* Text Color */}
                                <input
                                    type="color"
                                    onChange={(e) => applyFormat("foreColor", e.target.value)}
                                    className="w-10 h-9 border border-gray-300 rounded cursor-pointer"
                                    title="Text Color"
                                />

                                {/* Background Color */}
                                <input
                                    type="color"
                                    onChange={(e) => applyFormat("backColor", e.target.value)}
                                    className="w-10 h-9 border border-gray-300 rounded cursor-pointer"
                                    title="Highlight Color"
                                />

                                <div className="w-px bg-gray-300 mx-1"></div>

                                {/* Lists */}
                                <button
                                    type="button"
                                    onClick={() => applyFormat("insertUnorderedList")}
                                    className="p-2 hover:bg-gray-200 rounded transition-all"
                                    title="Bullet List (Tab for sub-points)"
                                >
                                    <List className="w-5 h-5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => applyFormat("insertOrderedList")}
                                    className="p-2 hover:bg-gray-200 rounded transition-all"
                                    title="Numbered List (Tab for sub-points)"
                                >
                                    <ListOrdered className="w-5 h-5" />
                                </button>

                                {/* Indent/Outdent */}
                                <button
                                    type="button"
                                    onClick={() => applyFormat("indent")}
                                    className="px-3 py-1 hover:bg-gray-200 rounded transition-all text-sm font-medium"
                                    title="Increase Indent (Tab)"
                                >
                                    →
                                </button>
                                <button
                                    type="button"
                                    onClick={() => applyFormat("outdent")}
                                    className="px-3 py-1 hover:bg-gray-200 rounded transition-all text-sm font-medium"
                                    title="Decrease Indent (Shift+Tab)"
                                >
                                    ←
                                </button>

                                <div className="w-px bg-gray-300 mx-1"></div>

                                {/* Alignment */}
                                <button
                                    type="button"
                                    onClick={() => applyFormat("justifyLeft")}
                                    className="px-3 py-1 hover:bg-gray-200 rounded transition-all text-sm font-medium"
                                    title="Align Left"
                                >
                                    L
                                </button>
                                <button
                                    type="button"
                                    onClick={() => applyFormat("justifyCenter")}
                                    className="px-3 py-1 hover:bg-gray-200 rounded transition-all text-sm font-medium"
                                    title="Align Center"
                                >
                                    C
                                </button>
                                <button
                                    type="button"
                                    onClick={() => applyFormat("justifyRight")}
                                    className="px-3 py-1 hover:bg-gray-200 rounded transition-all text-sm font-medium"
                                    title="Align Right"
                                >
                                    R
                                </button>
                            </div>

                            {/* Content Editable Area */}
                            <div
                                ref={contentEditableRef}
                                contentEditable
                                onInput={handleContentChange}
                                onKeyDown={(e) => {
                                    // Handle Tab for indent
                                    if (e.key === "Tab") {
                                        e.preventDefault();
                                        if (e.shiftKey) {
                                            applyFormat("outdent");
                                        } else {
                                            applyFormat("indent");
                                        }
                                    }
                                    // Prevent form submission on Enter
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.stopPropagation();
                                    }
                                }}
                                className="blog-editor w-full min-h-[300px] px-4 py-3 border-2 border-t-0 border-gray-200 rounded-b-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none overflow-auto"
                                data-placeholder="Write your story..."
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            onClick={handleSubmit}
                            className="w-full bg-linear-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            Publish Post
                        </button>
                    </div>
                </div>
            </div>

            {/* Blogs Display Section */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
                    Recent Posts
                </h2>

                {blogs.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
                        <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">
                            No posts yet. Create your first blog post!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {blogs.map((blog) => (
                            <article
                                key={blog.id}
                                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden border border-gray-100"
                            >
                                {blog.imageUrl && (
                                    <div className="w-full h-72 overflow-hidden bg-gray-100">
                                        <img
                                            src={blog.imageUrl}
                                            alt={blog.title}
                                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                )}

                                <div className="p-8">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-2xl font-bold text-gray-900 flex-1">
                                            {blog.title}
                                        </h3>
                                        <button
                                            onClick={() => removeBlog(blog.id)}
                                            className="ml-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            aria-label="Delete post"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {blog.createdOn && (
                                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                                            <Calendar className="w-4 h-4" />
                                            <time>{formatDate(blog.createdOn)}</time>
                                        </div>
                                    )}

                                    <div
                                        className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                                        style={{
                                            lineHeight: "1.6",
                                        }}
                                        dangerouslySetInnerHTML={{ __html: blog.content }}
                                    />
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="text-center py-8 text-gray-500">
                <p>Made with ❤️ using React & Firebase</p>
            </div>
        </div>
    );
}

