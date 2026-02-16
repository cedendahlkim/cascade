# Task: gen-list-average-1429 | Score: 100% | 2026-02-13T17:11:28.592505

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))