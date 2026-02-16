# Task: gen-ll-reverse_list-6232 | Score: 100% | 2026-02-14T12:37:18.661373

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))