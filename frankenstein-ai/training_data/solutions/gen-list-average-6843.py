# Task: gen-list-average-6843 | Score: 100% | 2026-02-15T10:28:32.104263

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))