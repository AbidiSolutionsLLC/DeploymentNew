import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjectGroups, createProjectGroup, deleteProjectGroup } from '../../store/projectGroupSlice';
import PageContainer from '../../components/ui/PageContainer';
import SearchBar from '../../components/SearchBar';
import { FaPlus, FaTrash } from 'react-icons/fa';
import GlassModal from '../../components/ui/GlassModal';
import { toast } from 'react-toastify';
import TableWithPagination from '../../components/TableWithPagination';
import { useConfirm } from '../../context/ConfirmContext';

const ProjectGroups = () => {
  const dispatch = useDispatch();
  const { groups = [], loading } = useSelector((state) => state.projectGroups || {});
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const confirm = useConfirm();

  useEffect(() => {
    dispatch(fetchProjectGroups());
  }, [dispatch]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await dispatch(createProjectGroup({ name, description })).unwrap();
      toast.success('Project group created');
      setShowModal(false);
      setName('');
      setDescription('');
    } catch (err) {
      toast.error(typeof err === 'string' ? err : err?.message || 'Failed to create group'); console.error('Create error:', err);
    }
  };

  const handleDelete = async (id) => {
    await confirm({
      title: 'Delete Group',
      message: 'Are you sure you want to delete this project group?',
      onConfirmAction: async () => {
        try {
          await dispatch(deleteProjectGroup(id)).unwrap();
          toast.success('Project group deleted');
        } catch (err) {
          toast.error(err || 'Failed to delete group');
        }
      }
    });
  };

  const columns = [
    {
      key: 'name',
      label: 'Group Name',
      render: (val) => <span className="font-semibold text-main whitespace-nowrap">{val}</span>
    },
    {
      key: 'description',
      label: 'Description',
      render: (val) => <span className="text-muted">{val || '-'}</span>
    },
    {
      key: 'projects',
      label: 'Projects Count',
      render: (val) => <span className="text-heading font-medium">{val?.length || 0}</span>
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, group) => (
        <button
          onClick={(e) => { e.stopPropagation(); handleDelete(group._id); }}
          className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/40 p-2 rounded-lg transition-colors"
        >
          <FaTrash />
        </button>
      )
    }
  ];

  return (
    <PageContainer
      title="Project Groups"
      subtitle="Manage your portfolios and groupings"
      loading={loading}
      isCard={true}
      headerActions={
        <div className="flex items-center gap-3">
          <SearchBar />
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 btn btn-primary py-2.5 px-4"
          >
            <FaPlus /> New Group
          </button>
        </div>
      }
    >
      <div className="w-full flex flex-col gap-4 mt-2">
        <TableWithPagination
          columns={columns}
          data={groups}
          loading={loading}
          emptyMessage="No project groups found"
          defaultSort={{ key: 'createdAt', direction: 'desc' }}
        />
      </div>

      <GlassModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create Project Group"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreate} className="p-4 flex flex-col gap-4 text-heading">
          <div>
            <label className="block text-sm font-medium mb-1">Group Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="glass-input"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="glass-input min-h-[100px]"
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Create Group</button>
          </div>
        </form>
      </GlassModal>
    </PageContainer>
  );
};

export default ProjectGroups;

