# Task: gen-ll-reverse_list-4660 | Score: 100% | 2026-02-15T10:50:31.017170

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))