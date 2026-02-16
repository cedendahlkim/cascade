# Task: gen-ds-reverse_with_stack-6160 | Score: 100% | 2026-02-14T12:02:06.444998

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))