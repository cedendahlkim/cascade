# Task: gen-ll-reverse_list-9979 | Score: 100% | 2026-02-13T16:48:01.816605

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))