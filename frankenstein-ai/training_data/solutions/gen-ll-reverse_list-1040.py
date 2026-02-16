# Task: gen-ll-reverse_list-1040 | Score: 100% | 2026-02-15T11:37:46.199418

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))