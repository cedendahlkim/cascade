# Task: gen-ll-reverse_list-2297 | Score: 100% | 2026-02-13T17:36:17.500338

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))