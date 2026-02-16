# Task: gen-ll-reverse_list-6663 | Score: 100% | 2026-02-13T10:14:39.257257

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))