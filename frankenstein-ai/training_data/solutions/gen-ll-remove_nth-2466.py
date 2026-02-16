# Task: gen-ll-remove_nth-2466 | Score: 100% | 2026-02-13T20:33:15.244827

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))