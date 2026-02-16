# Task: gen-ll-remove_nth-6782 | Score: 100% | 2026-02-14T12:08:46.279680

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))