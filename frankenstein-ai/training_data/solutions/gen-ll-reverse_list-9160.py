# Task: gen-ll-reverse_list-9160 | Score: 100% | 2026-02-13T16:47:12.689141

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))