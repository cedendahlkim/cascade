# Task: gen-ll-reverse_list-1134 | Score: 100% | 2026-02-13T11:18:09.953183

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))