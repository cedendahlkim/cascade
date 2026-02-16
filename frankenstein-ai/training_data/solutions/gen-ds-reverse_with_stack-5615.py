# Task: gen-ds-reverse_with_stack-5615 | Score: 100% | 2026-02-13T13:01:38.340154

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))