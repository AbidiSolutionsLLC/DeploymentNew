const FolderGrid = ({ folders, searchTerm, onOpenFolder }) => {
 const filtered =
 folders?.filter((f) =>
 // f.name.toLowerCase().includes(searchTerm.toLowerCase())
true
 ) ?? [];

 return (
 <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 w-full">
 {filtered.length ? (
 filtered.map((folder, i) => (
 <button
 key={i}
 onClick={() => onOpenFolder(folder)}
 className="flex flex-col items-start gap-1 bg-surface rounded-xl shadow p-4 text-left hover:shadow-md transition"
 >
 <div className="flex items-center gap-2">
 <img
 src="https://cdn-icons-png.flaticon.com/512/716/716784.png"
 alt="folder"
 className="w-6 h-6"
 />
 <h3 className="font-semibold text-main truncate max-w-[10rem]">
 {folder.name}
 </h3>
 </div>
 <p className="text-sm text-muted truncate max-w-[12rem]">
 {folder.file}
 </p>
 <p className="text-xs text-muted">
 {new Date(folder.createdAt).toLocaleDateString()}
 </p>
 </button>
 ))
 ) : (
 <p className="col-span-full text-center text-muted">
 No folders found.
 </p>
 )}
 </div>
 );
};

export default FolderGrid;
