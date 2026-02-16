# Task: gen-ll-reverse_list-4916 | Score: 100% | 2026-02-14T13:12:04.572282

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))