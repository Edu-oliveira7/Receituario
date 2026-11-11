from rest_framework import permissions

class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object or admins to edit/delete it.
    Read permissions are allowed to any request (GET, HEAD, OPTIONS).
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the author of the recipe or staff/admin
        if not (request.user and request.user.is_authenticated):
            return False

        if request.user.is_staff or request.user.is_superuser:
            return True

        # Check if object has an 'author' attribute or is a User instance itself
        if hasattr(obj, 'author'):
            return obj.author == request.user

        if obj == request.user:
            return True

        return False


class IsAdminUserOrReadOnly(permissions.BasePermission):
    """
    Allows read-only access for any request, but write access only to administrators.
    Used for categories and visual themes.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and (request.user.is_staff or request.user.is_superuser))


class IsStrictAdminUser(permissions.BasePermission):
    """
    Allows access only to staff or superusers.
    Used for the /api/admin/ endpoints.
    """

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.is_staff or request.user.is_superuser)
        )
