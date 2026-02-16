# Task: gen-ll-reverse_list-4427 | Score: 100% | 2026-02-15T12:03:46.825546

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))