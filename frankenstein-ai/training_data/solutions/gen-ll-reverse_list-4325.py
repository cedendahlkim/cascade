# Task: gen-ll-reverse_list-4325 | Score: 100% | 2026-02-15T07:48:25.539444

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))