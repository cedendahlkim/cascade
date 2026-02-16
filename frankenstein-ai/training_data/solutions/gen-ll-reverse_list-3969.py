# Task: gen-ll-reverse_list-3969 | Score: 100% | 2026-02-13T11:45:34.835901

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))