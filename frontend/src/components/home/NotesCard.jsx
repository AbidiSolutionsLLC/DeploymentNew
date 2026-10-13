import React, { useState, useRef, useEffect } from "react";
import { FiTrash2, FiEdit2, FiCheck, FiEdit, FiPlus } from "react-icons/fi";

import EmptyCardState from "./EmptyCardState";
import HomeCardShell from "./HomeCardShell";
import GlassButton from "../ui/GlassButton";

const NotesCard = ({ onDelete, userId }) => {
  const [notes, setNotes] = useState(() => {
    if (!userId) return [];
    try {
      return JSON.parse(localStorage.getItem(`notes_${userId}`)) || [];
    } catch {
      return [];
    }
  });
  const [newNote, setNewNote] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (userId) {
      localStorage.setItem(`notes_${userId}`, JSON.stringify(notes));
    }
  }, [notes, userId]);

  const addNote = () => {
    if (newNote.trim()) {
      setNotes([...notes, { id: Date.now(), text: newNote.trim() }]);
      setNewNote("");
    }
  };

  const startEditing = (note) => {
    setEditingId(note.id);
    setEditingText(note.text);
  };

  const saveEdit = (id) => {
    setNotes(notes.map((n) => (n.id === id ? { ...n, text: editingText } : n)));
    setEditingId(null);
    setEditingText("");
  };

  const removeNote = (id) => {
    setNotes(notes.filter((note) => note.id !== id));
  };

  return (
    <HomeCardShell
      title="Notes"
      sub="Write and edit personal notes"
      icon={FiEdit}
      accent="#F43F5E"
      onDelete={onDelete}
      menuRef={menuRef}
      menuOpen={menuOpen}
      onToggleMenu={() => setMenuOpen(!menuOpen)}
    >
      <div className="flex flex-col mb-2 gap-2 shrink-0">
        <input
          type="text"
          className="glass-input w-full !text-xs"
          placeholder="Write a note..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addNote()}
        />
        <GlassButton
          variant="primary"
          size="sm"
          onClick={addNote}
          className="flex items-center justify-center gap-1.5"
        >
          <FiPlus className="w-3 h-3" />
          Add
        </GlassButton>
      </div>

      {notes.length > 0 ? (
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar max-h-[100px] w-full">
          <ul className="space-y-2 text-[10px]">
            {notes.map((note) => (
              <li
                key={note.id}
                className="bg-app p-2 rounded-lg flex justify-between items-start gap-2"
              >
                <div className="flex-1">
                  {editingId === note.id ? (
                    <input
                      type="text"
                      className="glass-input w-full !text-xs !px-2 !py-1.5"
                      value={editingText}
                      autoFocus
                      onChange={(e) => setEditingText(e.target.value)}
                      onBlur={() => saveEdit(note.id)}
                      onKeyDown={(e) => e.key === "Enter" && saveEdit(note.id)}
                    />
                  ) : (
                    <p className="text-main cursor-pointer" onClick={() => startEditing(note)}>
                      {note.text}
                    </p>
                  )}
                </div>

                <div className="flex gap-1.5 items-end">
                  {editingId !== note.id ? (
                    <button
                      onClick={() => startEditing(note)}
                      className="bg-success-bg text-success p-1.5 rounded-md hover:brightness-95"
                      title="Edit"
                    >
                      <FiEdit2 className="h-3 w-3" />
                    </button>
                  ) : (
                    <button
                      onClick={() => saveEdit(note.id)}
                      className="text-brand-text hover:opacity-80 p-1.5"
                      title="Save"
                    >
                      <FiCheck className="h-3 w-3" />
                    </button>
                  )}
                  <button
                    onClick={() => removeNote(note.id)}
                    className="bg-danger-bg text-danger p-1.5 rounded-md hover:brightness-95"
                    title="Delete"
                  >
                    <FiTrash2 className="h-3 w-3" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <EmptyCardState message="You haven't added anything yet" />
      )}
    </HomeCardShell>
  );
};

export default NotesCard;
