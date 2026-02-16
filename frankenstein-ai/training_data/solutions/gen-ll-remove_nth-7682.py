# Task: gen-ll-remove_nth-7682 | Score: 100% | 2026-02-15T10:10:05.127418

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))