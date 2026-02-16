# Task: gen-ds-reverse_with_stack-7856 | Score: 100% | 2026-02-13T12:42:52.433965

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))