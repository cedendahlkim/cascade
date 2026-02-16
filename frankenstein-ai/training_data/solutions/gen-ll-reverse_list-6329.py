# Task: gen-ll-reverse_list-6329 | Score: 100% | 2026-02-13T15:46:27.504193

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))