# Task: gen-ll-reverse_list-2487 | Score: 100% | 2026-02-15T07:48:39.319978

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))