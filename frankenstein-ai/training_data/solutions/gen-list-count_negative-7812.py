# Task: gen-list-count_negative-7812 | Score: 100% | 2026-02-13T14:18:45.936022

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x < 0))