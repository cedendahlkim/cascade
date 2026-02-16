# Task: gen-ll-reverse_list-1194 | Score: 100% | 2026-02-13T09:34:17.286771

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))