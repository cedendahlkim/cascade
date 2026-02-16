# Task: gen-list-average-2177 | Score: 100% | 2026-02-15T10:09:46.184740

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))