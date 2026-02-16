# Task: gen-ll-remove_nth-2169 | Score: 100% | 2026-02-15T12:29:32.655868

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))