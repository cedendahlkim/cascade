# Task: gen-ll-remove_nth-2737 | Score: 100% | 2026-02-13T12:27:12.113122

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))