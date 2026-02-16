# Task: gen-ll-reverse_list-3611 | Score: 100% | 2026-02-13T20:32:28.172878

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))