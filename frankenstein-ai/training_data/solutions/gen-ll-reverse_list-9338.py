# Task: gen-ll-reverse_list-9338 | Score: 100% | 2026-02-15T07:49:38.012294

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))