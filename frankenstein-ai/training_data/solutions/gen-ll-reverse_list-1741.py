# Task: gen-ll-reverse_list-1741 | Score: 100% | 2026-02-14T12:59:35.817632

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))