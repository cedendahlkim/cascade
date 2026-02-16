# Task: gen-ll-reverse_list-1688 | Score: 100% | 2026-02-13T18:38:28.926373

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))