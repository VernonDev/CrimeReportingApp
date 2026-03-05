'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { z } from 'zod';
import { categoriesApi, Category, reportsApi, uploadApi } from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const LocationPicker = dynamic(() => import('@/components/map/LocationPicker'), { ssr: false });

const schema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000),
  categoryId: z.string().min(1, 'Please select a category'),
  incidentDate: z.string().min(1, 'Please select an incident date'),
});

interface ReportFormProps {
  onSuccess?: (reportId: number) => void;
}

export default function ReportForm({ onSuccess }: ReportFormProps) {
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    categoryId: '',
    incidentDate: '',
    isAnonymous: false,
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    categoriesApi.list().then((r) => setCategories(r.data.data));
  }, []);

  const handleLocationSelect = (lat: number, lng: number, address?: string) => {
    setLocation({ lat, lng, address });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 3);
    setPhotos(files);
  };

  const validateStep1 = () => {
    if (!location) {
      setErrors({ location: 'Please select a location on the map' });
      return false;
    }
    setErrors({});
    return true;
  };

  const validateStep2 = () => {
    const result = schema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[String(err.path[0])] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleSubmit = async () => {
    if (!location) return;
    setLoading(true);
    setApiError('');

    try {
      let photoPaths: string[] = [];
      if (photos.length > 0) {
        const uploadRes = await uploadApi.upload(photos);
        photoPaths = uploadRes.data.data.paths;
      }

      const res = await reportsApi.create({
        location: { lat: location.lat, lng: location.lng },
        categoryId: parseInt(form.categoryId),
        title: form.title,
        description: form.description,
        incidentDate: new Date(form.incidentDate).toISOString(),
        isAnonymous: form.isAnonymous,
        address: location.address,
        photoPaths,
      });

      onSuccess?.(res.data.data.id);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setApiError(e.response?.data?.message || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {s}
            </div>
            {s < 3 && <div className={`h-0.5 w-8 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />}
          </div>
        ))}
        <span className="ml-2 text-gray-500">
          {step === 1 ? 'Location' : step === 2 ? 'Details' : 'Review & Submit'}
        </span>
      </div>

      {/* Step 1: Location */}
      {step === 1 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800">Select Incident Location</h3>
          <LocationPicker onLocationSelect={handleLocationSelect} />
          {location && (
            <p className="text-sm text-green-600">
              Location selected{location.address ? `: ${location.address.slice(0, 60)}...` : ''}
            </p>
          )}
          {errors.location && <p className="text-xs text-red-600">{errors.location}</p>}
        </div>
      )}

      {/* Step 2: Details */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800">Crime Details</h3>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Category</label>
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              <option value="">Select category...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.categoryId && <p className="text-xs text-red-600">{errors.categoryId}</p>}
          </div>

          <Input
            id="title"
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            error={errors.title}
            placeholder="Brief description of the incident"
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[100px] ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe what happened in detail (at least 20 characters)"
            />
            {errors.description && <p className="text-xs text-red-600">{errors.description}</p>}
          </div>

          <Input
            id="incidentDate"
            label="Incident Date & Time"
            type="datetime-local"
            value={form.incidentDate}
            onChange={(e) => setForm({ ...form, incidentDate: e.target.value })}
            error={errors.incidentDate}
            max={new Date().toISOString().slice(0, 16)}
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Photos (up to 3)</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handlePhotoChange}
              className="text-sm text-gray-600"
            />
            {photos.length > 0 && (
              <p className="text-xs text-gray-500">{photos.length} file(s) selected</p>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isAnonymous}
              onChange={(e) => setForm({ ...form, isAnonymous: e.target.checked })}
              className="rounded"
            />
            Submit anonymously
          </label>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800">Review Your Report</h3>
          {apiError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {apiError}
            </div>
          )}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div><span className="font-medium">Location:</span> {location?.address || `${location?.lat}, ${location?.lng}`}</div>
            <div><span className="font-medium">Category:</span> {categories.find((c) => String(c.id) === form.categoryId)?.name}</div>
            <div><span className="font-medium">Title:</span> {form.title}</div>
            <div><span className="font-medium">Description:</span> {form.description}</div>
            <div><span className="font-medium">Date:</span> {new Date(form.incidentDate).toLocaleString()}</div>
            <div><span className="font-medium">Photos:</span> {photos.length}</div>
            <div><span className="font-medium">Anonymous:</span> {form.isAnonymous ? 'Yes' : 'No'}</div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        {step > 1 ? (
          <Button variant="secondary" onClick={() => setStep(step - 1)} disabled={loading}>
            Back
          </Button>
        ) : (
          <span />
        )}
        {step < 3 ? (
          <Button onClick={handleNext}>Next</Button>
        ) : (
          <Button onClick={handleSubmit} loading={loading} variant="primary">
            Submit Report
          </Button>
        )}
      </div>
    </div>
  );
}
