# Task: gen-ll-reverse_list-3624 | Score: 100% | 2026-02-14T13:41:34.500414

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))