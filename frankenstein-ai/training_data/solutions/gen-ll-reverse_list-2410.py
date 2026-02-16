# Task: gen-ll-reverse_list-2410 | Score: 100% | 2026-02-14T12:04:34.070047

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))