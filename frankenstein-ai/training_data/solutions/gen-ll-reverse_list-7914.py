# Task: gen-ll-reverse_list-7914 | Score: 100% | 2026-02-15T08:14:19.691415

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))