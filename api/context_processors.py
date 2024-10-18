def user_info(request):
    return {
        'username': request.session.get('username'),
        'is_admin': request.session.get('is_admin', False),
    }
