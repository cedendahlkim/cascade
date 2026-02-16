# Task: gen-ll-reverse_list-7888 | Score: 100% | 2026-02-15T10:51:05.433955

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))