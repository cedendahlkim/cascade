# Task: gen-ll-reverse_list-1394 | Score: 100% | 2026-02-15T07:46:03.130978

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))