# Task: gen-ll-remove_nth-3686 | Score: 100% | 2026-02-13T17:36:00.595512

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))