# Task: gen-list-average-1866 | Score: 100% | 2026-02-13T21:27:58.215986

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))