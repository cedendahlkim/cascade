# Task: gen-list-count_negative-8291 | Score: 100% | 2026-02-13T19:35:44.276997

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x < 0))